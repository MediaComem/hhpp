# HHPP website



## Requirements

* Ruby 2+

* [Jekyll](https://jekyllrb.com) (install with `gem install jekyll`)

* [Gulp](http://gulpjs.com) for development (install with `npm install -g gulp`)



## Development

* Clone this repo and move into its directory.

* Install Ruby tools with `bundle install`.

* Install Node.js dependencies with `npm install`.

* Run `jekyll serve`.

* Run `gulp dev` to compile and inject assets (and watch for changes).



## Production

* Clone this repo and move into its directory.

* Install Node.js dependencies with `npm install`.

* Run `./production.sh` to build the site and push it to the `gh-pages` branch.



### Assets

* Stylesheets are written in [Stylus](http://stylus-lang.com) in the `_stylus` directory.

    If the `gulp dev` task is running, changed Stylus files will automatically be compiled to CSS
    and saved into the `css` directory. The list of stylesheets will also be injected into
    `_includes/head.html`.

* JavaScript files are in the `js` directory.

    If the `gulp dev` task is running, the list of JavaScript files will automatically be injected
    into `_includes/footer.html`.
