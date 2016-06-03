# HHPP website



## Requirements

* Ruby 2+

* [Jekyll](https://jekyllrb.com) (install with `gem install jekyll`)

* [Gulp](http://gulpjs.com) for developmentk(install with `npm install -g gulp`)



## Development

* Clone this repo.

* Run `jekyll serve` in the repo.

* Run `gulp dev` to compile and inject assets (and watch for changes).



### Assets

* Stylesheets are written in [Stylus](http://stylus-lang.com) in the `_stylus` directory.

    If the `gulp dev` task is running, changed Stylus files will automatically be compiled to CSS
    and saved into the `css` directory. The list of stylesheets will also be injected into
    `_includes/head.html`.

* JavaScript files are in the `js` directory.

    If the `gulp dev` task is running, the list of JavaScript files will automatically be injected
    into `_includes/footer.html`.
