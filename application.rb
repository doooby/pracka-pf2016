
require 'sinatra'
require 'sinatra/asset_pipeline'

configure do
  set :root, File.expand_path('..',  __FILE__)
  register Sinatra::AssetPipeline
end


configure :development do
  require 'sass'
  settings.sprockets.append_path '/home/ondra/Projects/_js/d2o/lib'
end

GAME_GLOBALS = {
    dimensions: [300, 500]
}

get '/' do
  erb :page
end