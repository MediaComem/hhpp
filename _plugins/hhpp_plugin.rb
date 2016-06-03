require 'json'
require 'fileutils'

module Jekyll

  class HhppVideoPage < Page
    def initialize site:, base:, dir:, page_type:, video:, video_category: nil
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'

      process name
      read_yaml base, 'index.html'

      data.default_proc = proc do |_, key|
        site.frontmatter_defaults.find(File.join(dir, name), type, key)
      end

      Jekyll::Hooks.trigger :pages, :post_init, self

      hhpp_data = site.data['hhpp']

      data['page_type'] = page_type if page_type
      data['video'] = video
      data['video_category'] = video_category if video_category
      data['videos'] = video_category ? video_category['videos'] : hhpp_data['videos']
      data['title'] = video['title']
    end
  end

  class HhppGenerator < Generator
    safe true

    def generate site
      hhpp_data = site.data['hhpp']

      index_page = site.pages.find do |page|
        page.name == 'index.html'
      end

      hhpp_data['categories'].each do |category|
        category['videos'] = hhpp_data['videos'].select{ |video| video['category'] == category['key'] }
        site.pages << HhppVideoPage.new(site: site, base: site.source, dir: category['key'], page_type: 'category', video: category['videos'].first, video_category: category)
      end

      hhpp_data['videos'].each do |video|
        video['path'] = "/#{video['category']}/#{video['key']}"
        video_category = hhpp_data['categories'].find{ |cat| cat['key'] == video['category'] }
        site.pages << HhppVideoPage.new(site: site, base: site.source, dir: video['key'], page_type: 'video', video: video)
        site.pages << HhppVideoPage.new(site: site, base: site.source, dir: File.join(video['category'], video['key']), page_type: 'video_in_category', video: video, video_category: video_category)
      end

      hhpp_data['categories'].each do |category|
        json_file = File.join Dir.pwd, '_site', 'api', 'categories', "#{category['key']}.json"
        FileUtils.mkdir_p File.dirname(json_file)
        File.open(json_file, 'w'){ |f| f.write JSON.dump(category) }
      end

      api_categories_json_file = File.join Dir.pwd, '_site', 'api', 'categories.json'
      api_categories = hhpp_data['categories'].map{ |cat| cat.reject{ |k,v| k == 'videos' } }
      File.open(api_categories_json_file, 'w'){ |f| f.write JSON.dump(api_categories) }

      api_videos_json_file = File.join Dir.pwd, '_site', 'api', 'videos.json'
      api_videos = hhpp_data['videos'].map{ |video| video.reject{ |k,v| k == 'path' } }
      File.open(api_videos_json_file, 'w'){ |f| f.write JSON.dump(api_videos) }

      default_video_category = hhpp_data['categories'].first
      index_page.data['video'] = default_video_category['videos'].first
      index_page.data['videos'] = hhpp_data['videos']
    end
  end

end
