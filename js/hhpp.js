(function(exports) {

  var initialized = false;

  var apiDeferreds = {
    categories: [],
    videos: []
  };

  function HHPP() {
    this.categories = [];
    this.videos = [];
    this.events = $({});
    this.baseUrl = $('meta[name="baseurl"]').attr('content') || '';
  }

  _.extend(HHPP.prototype, {
    isCurrentVideo: function(video) {
      return video && this.currentVideoKey && video.key == this.currentVideoKey && (!this.currentCategoryKey || video.category == this.currentCategoryKey);
    },

    setCurrentVideo: function(videoKey, categoryKey, pageType) {

      var pageTypeChanged = pageType && pageType != this.pageType,
          videoChanged = videoKey && videoKey != this.currentVideoKey,
          categoryChanged = (categoryKey || this.currentCategoryKey) && categoryKey != this.currentCategoryKey;

      if (!pageTypeChanged && !videoChanged && !categoryChanged) {
        return;
      }

      var promise = $.Deferred().resolve();

      var eventData = {};

      if (videoChanged) {

        var previousVideoKey = this.currentVideoKey;
        this.currentVideoKey = videoKey;

        eventData.videoChanged = true;

        if (previousVideoKey) {
          promise = promise.then(_.partial(swapVideosOrder, previousVideoKey, videoKey));
        }
      }

      if (categoryChanged) {

        var previousCategoryKey = this.currentCategoryKey;
        this.currentCategoryKey = categoryKey;

        eventData.categoryChanged = true;

        if (previousCategoryKey && categoryKey) {
          promise = promise.then(_.bind(this.getRandomCategoryVideo, this, categoryKey)).then(_.bind(function(video) {
            this.currentVideoKey = video.key;
            eventData.videoChanged = true;
          }, this));
        } else if (initialized && !previousCategoryKey && categoryKey) {
          promise = promise.then(_.bind(this.getVideoCategory, this, this.currentVideoKey)).then(_.bind(function(category) {
            if (category.key != this.currentCategoryKey) {
              return this.getRandomCategoryVideo(this.currentCategoryKey).then(_.bind(function(video) {
                this.currentVideoKey = video.key;
                eventData.videoChanged = true;
              }, this));
            }
          }, this));
        }
      }

      if (!initialized) {
        initialized = true;
        eventData.initialized = true;

        if (pageType == 'index') {
          promise = promise.then(_.bind(this.getRandomVideo, this)).then(_.bind(function(video) {
            this.currentVideoKey = video.key;
            eventData.videoChanged = true;
          }, this));
        } else if (pageType == 'category') {
          promise = promise.then(_.bind(this.getRandomCategoryVideo, this, categoryKey)).then(_.bind(function(video) {
            this.currentVideoKey = video.key;
            eventData.videoChanged = true;
          }, this));
        }
      }

      return promise.then(_.partial(triggerVideoChanged, eventData));
    },

    getVideos: function() {
      if (!_.isEmpty(this.videos)) {
        return $.Deferred().resolve(this.videos).promise();
      }

      if (apiDeferreds.videos && _.isEmpty(apiDeferreds.videos)) {
        $.ajax({
          url: this.url('api', 'videos.json')
        }).then(_.bind(function(data) {

          shuffleVideos(data);
          this.videos = data;

          _.invokeMap(apiDeferreds.videos, 'resolve', data);

          delete apiDeferreds.videos;
        }, this));
      }

      var deferred = $.Deferred();
      apiDeferreds.videos.push(deferred);

      return deferred.promise();
    },

    getCurrentRelatedVideos: function() {

      var currentCategoryKey = this.currentCategoryKey,
          currentVideoKey = this.currentVideoKey;

      return this.getVideos().then(function(videos) {
        if (currentCategoryKey) {
          videos = _.filter(videos, { category: currentCategoryKey });
        }

        return _.filter(videos, function(video) {
          return video.key != currentVideoKey;
        });
      });
    },

    getCategoryVideos: function(key) {
      return this.getVideos().then(function(videos) {
        return _.filter(videos, { category: key });
      });
    },

    getRandomCategoryVideo: function(key) {
      return this.getCategoryVideos(key).then(function(videos) {
        return _.sample(videos);
      });
    },

    getRandomVideo: function() {
      return this.getVideos().then(function(videos) {
        return _.sample(videos);
      });
    },

    getCategory: function(key) {
      return this.getCategories().then(function(categories) {
        return _.find(categories, { key: key });
      });
    },

    getCategories: function() {
      if (!_.isEmpty(this.categories)) {
        return $.Deferred().resolve(this.categories).promise();
      }

      if (apiDeferreds.categories && _.isEmpty(apiDeferreds.categories)) {
        $.ajax({
          url: this.url('api', 'categories.json')
        }).then(_.bind(function(data) {

          this.categories = data;

          _.invokeMap(apiDeferreds.categories, 'resolve', data);

          delete apiDeferreds.categories;
        }, this));
      }

      var deferred = $.Deferred();
      apiDeferreds.categories.push(deferred);

      return deferred.promise();
    },

    getCurrentCategory: function() {
      if (!this.currentCategoryKey) {
        return $.Deferred().resolve().promise();
      }

      return this.getCategory(this.currentCategoryKey);
    },

    getVideoOrder: function(videoKey) {
      var video = _.find(hhpp.videos, { key: videoKey });
      return video ? video.order : undefined;
    },

    getVideoCategory: function(videoKey) {
      return this.getVideo(videoKey).then(_.bind(function(video) {
        return this.getCategory(video.category);
      }, this));
    },

    getVideo: function(videoKey) {
      return this.getVideos().then(function(videos) {
        return _.find(videos, { key: videoKey });
      });
    },

    buildVideoContainer: function(video) {

      var $container = $('<div class="related-video video-container video-visible grid-25 tablet-grid-33 mobile-grid-50" />');
      $container.attr('data-video', video.key);

      var $link = $('<a class="video-link" />');
      $link.attr('href', this.url(video.category, video.key));
      $link.appendTo($container);

      var $videoElement = $('<div class="video" />');
      $videoElement.text(video.title);
      $videoElement.appendTo($link);

      return $container;
    },

    url: function() {
      return _.reduce(Array.prototype.slice.call(arguments), function(memo, part) {
        return memo + '/' + part.replace(/^\//, '');
      }, this.baseUrl.replace(/\/$/, ''));
    }
  });

  var hhpp = exports.HHPP = new HHPP();

  $(window).on('popstate', function(event) {
    if (event.originalEvent && event.originalEvent.state && event.originalEvent.state.video) {
      hhpp.setCurrentVideo(event.originalEvent.state.video, event.originalEvent.state.category, event.originalEvent.state.pageType);
    }
  });

  $(document).on('click', 'a.video-link', function(event) {
    if (historyEnabled()) {
      event.preventDefault();

      var $link = $(event.currentTarget),
          $dataElement = $link.closest('[data-video]');

      if (!$dataElement.length) {
        $dataElement = $link.closest('[data-video-category]');
      }

      if (!$dataElement.length) {
        $dataElement = $link.closest('[data-page-type]');
      }

      var pageType = $dataElement.data('page-type'),
          videoKey = $dataElement.data('video'),
          categoryKey = $dataElement.data('video-category');

      if (!categoryKey && !videoKey) {
        pageType = pageType || 'index';
      }

      if (videoKey || categoryKey || pageType) {
        hhpp.setCurrentVideo(videoKey, categoryKey, pageType).then(pushHistoryState);
      }
    }
  });

  hhpp.events.on('hhpp-video-changed', function(event, data) {
    console.log('HHPP video changed: ' + JSON.stringify(data));
  });

  $(function() {
    setTimeout(initialize, 1);
  });

  function initialize() {
    var $head = $('head');
    hhpp.setCurrentVideo($head.data('video'), $head.data('video-category'), $head.data('page-type') || 'index').then(function() {
      replaceHistoryState();
    });
  }

  function triggerVideoChanged(options) {
    hhpp.events.trigger('hhpp-video-changed', _.extend({}, options, {
      videoKey: hhpp.currentVideoKey,
      categoryKey: hhpp.currentCategoryKey,
    }));
  }

  function replaceHistoryState() {
    history.replaceState({
      pageType: hhpp.pageType,
      video: hhpp.currentVideoKey,
      category: hhpp.currentCategoryKey
    }, 'title', buildCurrentUrl());
  }

  function pushHistoryState() {
    history.pushState({
      pageType: hhpp.pageType,
      video: hhpp.currentVideoKey,
      category: hhpp.currentCategoryKey
    }, 'title', buildCurrentUrl());
  }

  function buildCurrentUrl() {

    var urlParts = [];

    if (hhpp.currentCategoryKey) {
      urlParts.push(hhpp.currentCategoryKey);
    }

    if (hhpp.currentVideoKey) {
      urlParts.push(hhpp.currentVideoKey);
    }

    return hhpp.url.apply(hhpp, urlParts) + '/';
  }

  function historyEnabled() {
    return window.history && window.history.replaceState && window.history.pushState;
  }

  function swapVideosOrder(key1, key2) {
    return hhpp.getVideos().then(function(videos) {

      var video1 = _.find(videos, { key: key1 }),
          video2 = _.find(videos, { key: key2 });

      var swap = video2.order;
      video2.order = video1.order;
      video1.order = swap;
    });
  }

  function shuffleVideos(videos) {

    var numbers = [];

    _.each(videos, function(video) {

      var number;
      do {
        number = Math.round(Math.random() * 1000);
      } while (_.includes(numbers, number));

      video.order = number;
    });
  }

})(window);
