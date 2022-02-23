Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  get 'modals' => 'client_side#modals'
  get 'replaced_content' => 'client_side#replaced_content'

  get 'rendering/exception'

  get 'sql' => 'sql#index'

  get 'tinytemplate' => 'tinytemplate#index'

  get 'urls' => 'client_side#urls'

  get 'versions' => 'client_side#versions'

  get 'logging' => 'client_side#logging'

  get 'reports' => 'scripts#reports'

  mount Terrier::Engine, at: "/"

  root 'application#home'
end
