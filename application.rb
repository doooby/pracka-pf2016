
require 'sinatra'
require 'sinatra/asset_pipeline'

require 'sass'

configure do
  set :root, File.expand_path('..',  __FILE__)

  if settings.production?
    require 'uglifier'
    set :assets_css_compressor, :sass
    set :assets_js_compressor, :uglifier
  end

  register Sinatra::AssetPipeline
  settings.assets_precompile << '*.mp3'

  if settings.development?
    settings.sprockets.append_path '/home/ondra/Projects/_js/d2o/lib'
  end

end

get '/' do
  erb :page
end