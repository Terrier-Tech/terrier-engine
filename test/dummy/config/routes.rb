Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  get 'modals' => 'client_side#modals'

  get 'rendering/exception'

  get 'sql' => 'sql#index'

  get 'tinytemplate' => 'tinytemplate#index'

  get 'urls' => 'client_side#urls'

  get 'versions' => 'client_side#versions'

  get 'logging' => 'client_side#logging'

  mount Plunketts::Engine, at: "/"

  root 'application#home'
end
