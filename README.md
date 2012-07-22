Vizzuality Timeline
-------------------

Showing the things have happened in Vizzuality, using <a href="http://cartodb.com" target="_blank">CartoDB</a> as database.


###COMPASS CONFIGURATION
 
If you want to run 'compass' gem, you need to installed:

```bash
gem install bundler
bundle install
```

And then config it:

Add Gemfile.lock

```ruby
GEM
  remote: http://rubygems.org/
  specs:
    chunky_png (1.2.5)
    compass (0.11.7)
      chunky_png (~> 1.2)
      fssm (>= 0.2.7)
      sass (~> 3.1)
    fssm (0.2.8.1)
    oily_png (1.0.2)
      chunky_png (~> 1.2.1)
    sass (3.2.0.alpha.55)

PLATFORMS
  ruby

DEPENDENCIES
  compass
  oily_png
  sass (>= 3.2.0.alpha.0)
```

Add Gemfile

```ruby
source :gemcutter

gem 'sass', '>= 3.2.0.alpha.0'
gem 'compass'
gem 'oily_png'
```

Add config.rb

```ruby
http_path           = "/"
project_path        = "."
sass_dir            = "css/scss"
css_dir             = "/css"
images_dir          = "/img"
http_images_path    = "/img"
relative_assets     = "false"


sass_options = {
  :syntax => :scss
}

line_comments       = false
output_style        = :compact
```