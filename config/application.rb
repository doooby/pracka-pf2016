
require 'sinatra/base'
require 'sinatra/asset_pipeline'

class PFapp < Sinatra::Base

  set :root, File.expand_path('../..',  __FILE__)

  register Sinatra::AssetPipeline
  settings.sprockets.append_path "#{root}/bower_components"

  if self.development?

    require 'sass'

    require 'sinatra/reloader'
    register Sinatra::Reloader
    also_reload "#{root}/lib/**/*.rb"

  end
end

Dir["#{PFapp.root}/lib/**/*.rb"].each{|file| require file}