/**
 * This file creates a global HHPP variable which manages the current state (selected category & displayed videos).
 */
(function(exports) {

  var apiDeferreds = {
    categories: [],
    videos: []
  };

  var templates = {};

  /**
   * Constructs the HHPP object.
   */
  function HHPP() {

    this.initialized = false;

    // The category & video data will be lazily loaded and held in memory.
    this.categories = [];
    this.videos = [];

    // jQuery object that will be used as an event bus with `jQuery.on` and `jQuery.trigger`.
    this.events = $({});

    // Retrieve the base URL to support deployment in a sub-directory.
    this.baseUrl = $('meta[name="baseurl"]').attr('content') || '';
  }

  // HHPP object methods.
  _.extend(HHPP.prototype, {

    /**
     * Indicates whether the specified video object is the currently selected main video.
     *
     * @returns {Boolean}
     */
    isCurrentVideo: function(video) {
      return video && this.currentVideoKey && video.key == this.currentVideoKey && (!this.currentCategoryKey || video.category == this.currentCategoryKey);
    },

    setCurrentVideo: function(videoKey, categoryKey, pageType) {

      var pageTypeChanged = pageType && pageType != this.pageType,
          videoChanged = videoKey && videoKey != this.currentVideoKey,
          categoryChanged = pageType && (categoryKey || this.currentCategoryKey) && categoryKey != this.currentCategoryKey;

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

        // Re-shuffle videos when going from a category to the main page with all categories.
        if (!categoryKey) {
          shuffleVideos(this.videos);
        }

        var currentVideoKey = this.currentVideoKey;
        if (previousCategoryKey && categoryKey) {
          promise = promise.then(setRandomVideoFromCurrentCategory).then(function(video) {
            eventData.videoChanged = video.key != currentVideoKey;
          });
        } else if (this.initialized && !previousCategoryKey && categoryKey) {
          promise = promise.then(setRandomVideoIfCategoryChanged).then(function(video) {
            eventData.videoChanged = video.key != currentVideoKey;
          });
        }
      }

      if (!this.initialized) {
        this.initialized = true;
        eventData.initialized = true;

        if (pageType == 'index') {
          promise = promise.then(setRandomVideo).then(function() {
            eventData.videoChanged = true;
          });
        } else if (pageType == 'category') {
          promise = promise.then(setRandomVideoFromCurrentCategory).then(function() {
            eventData.videoChanged = true;
          });
        }
      }

      return promise.then(_.partial(triggerVideoChanged, eventData));
    },

    /**
     * Returns a promise that will be resolved with the list of all videos (from all categories).
     *
     * The list is retrieved asynchronously with an AJAX call the first time, then cached for future calls.
     *
     * @returns {Promise}
     */
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

    /**
     * Returns a promise that will be resolved with the list of all videos from the currently
     * selected category, except the main video. If no category is selected, the list will
     * contain all videos except the main video.
     *
     * @returns {Promise}
     */
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

    /**
     * Returns a promise that will be resolved with the list of all videos in the category
     * with the specified key.
     *
     * @param {String} categoryKey
     * @returns {Promise}
     */
    getCategoryVideos: function(categoryKey) {
      return this.getVideos().then(function(videos) {
        return _.filter(videos, { category: categoryKey });
      });
    },

    /**
     * Returns a promise that will be resolved with a random video in the category with
     * the specified key.
     *
     * @param {String} categoryKey
     * @returns {Promise}
     */
    getRandomCategoryVideo: function(categoryKey) {
      return this.getCategoryVideos(categoryKey).then(function(videos) {
        return _.sample(videos);
      });
    },

    /**
     * Returns a promise that will be resolved with a random video in any category.
     *
     * @returns {Promise}
     */
    getRandomVideo: function() {
      return this.getVideos().then(function(videos) {
        return _.sample(videos);
      });
    },

    /**
     * Returns a promise that will be resolved with the category that has the specified key.
     *
     * @param {String} categoryKey
     * @returns {Promise)
     */
    getCategory: function(categoryKey) {
      return this.getCategories().then(function(categories) {
        return _.find(categories, { key: categoryKey });
      });
    },

    /**
     * Returns a promise that will be resolved with the list of all categories.
     *
     * The list is retrieved asynchronously with an AJAX call the first time, then cached for future calls.
     *
     * @returns {Promise}
     */
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

    /**
     * Returns a promise that will be resolved with the currently selected category.
     * If no category is selected, the resolved value will be undefined.
     *
     * @returns {Promise}
     */
    getCurrentCategory: function() {
      if (!this.currentCategoryKey) {
        return $.Deferred().resolve().promise();
      }

      return this.getCategory(this.currentCategoryKey);
    },

    /**
     * Returns a number that can be used to determine the display position of the video
     * with the specified key.
     *
     * Note that this method is synchronous. It does not return a promise but the actual value.
     *
     * @param {String} videoKey
     * @returns {Number}
     */
    getVideoOrder: function(videoKey) {
      var video = _.find(hhpp.videos, { key: videoKey });
      return video ? video.order : undefined;
    },

    /**
     * Returns a promise that will be resolved with the category of the video that has the specified key.
     *
     * @param {String} videoKey
     * @returns {Promise}
     */
    getVideoCategory: function(videoKey) {
      return this.getVideo(videoKey).then(_.bind(function(video) {
        return this.getCategory(video.category);
      }, this));
    },

    /**
     * Returns a promise that will be resolved with the video that has the specified key.
     *
     * @param {String} videoKey
     * @returns {Promise}
     */
    getVideo: function(videoKey) {
      return this.getVideos().then(function(videos) {
        return _.find(videos, { key: videoKey });
      });
    },

    /**
     * Returns a promise that will be resolved with the currently displayed main video.
     *
     * @returns {Promise}
     */
    getCurrentVideo: function() {
      return this.getVideo(this.currentVideoKey);
    },

    /**
     * Returns a jQuery element representing a video that is not the main video.
     *
     * @param {object} video
     * @returns {jQuery}
     */
    buildVideoContainer: function(video) {

      var url = buildVideoUrl(video.key, this.currentCategoryKey);

      return this.getCategory(video.category).then(function(category) {

        var template = getTemplate('related-video'),
            $element = $(template);

        var $container = $element.closest('.video-container');
        $container.attr('data-video', video.key);
        $container.attr('data-video-category', video.category);

        var $link = $element.find('.video-link');
        $link.attr('href', url);

        var $videoElement = $element.find('.video');
        $videoElement.css('background-color', video.color);

        var $titleElement = $element.find('.title');
        $titleElement.text(video.title);

        return $container;
      });
    },

    /**
     * Returns the full URL for the specified video, suitable for display in an iframe.
     *
     * @param {object} video
     * @returns string
     */
    getVideoUrl: function(video) {
      return 'https://player.vimeo.com/video/' + video.video_id + '?color=7ac2be&title=0&byline=0&portrait=0&badge=0';
    },

    /**
     * Builds a URL relative to the site's base URL.
     *
     * @param {...string} parts
     * @example
     * HHPP.url('foo', 'bar'); // => "/baseurl/foo/bar"
     */
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
    if (hhpp.initialized && historyEnabled()) {
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
    log.debug('HHPP video changed: ' + JSON.stringify(data));
  });

  $(function() {
    setTimeout(initialize, 1);
  });

  function initialize() {
    if (!$('#hhpp-videos').length) {
      return;
    }

    var $head = $('head');
    hhpp.setCurrentVideo($head.data('video'), $head.data('video-category'), $head.data('page-type') || 'index').then(function() {
      replaceHistoryState();
    });
  }

  function setRandomVideo() {
    return hhpp.getRandomVideo().then(function(video) {
      hhpp.currentVideoKey = video.key;
      return video;
    });
  }

  function setRandomVideoFromCurrentCategory() {
    return setRandomVideoFromCategory(hhpp.currentCategoryKey);
  }

  function setRandomVideoFromCategory(categoryKey) {
    return hhpp.getRandomCategoryVideo(categoryKey).then(function(video) {
      hhpp.currentVideoKey = video.key;
      return video;
    });
  }

  function setRandomVideoIfCategoryChanged() {
    return hhpp.getVideoCategory(hhpp.currentVideoKey).then(function(category) {
      if (category.key != hhpp.currentCategoryKey) {
        return setRandomVideoFromCategory(hhpp.currentCategoryKey);
      } else {
        return hhpp.getCurrentVideo();
      }
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

  function buildVideoUrl(videoKey, categoryKey) {

    var urlParts = [];

    if (categoryKey) {
      urlParts.push(categoryKey);
    }

    if (videoKey) {
      urlParts.push(videoKey);
    }

    return hhpp.url.apply(hhpp, urlParts) + '/';
  }

  function buildCurrentUrl() {
    return buildVideoUrl(hhpp.currentVideoKey, hhpp.currentCategoryKey);
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

  function getTemplate(name) {
    if (!templates[name]) {

      $templateElement = $('[data-template="' + name + '"]');
      if (!$templateElement.length) {
        throw new Error('Expected to find <script> tag with data-template="' + name + '" attribute');
      }

      templates[name] = $templateElement.text();
    }

    return templates[name];
  }

})(window);
