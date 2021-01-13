Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  get 'modals' => 'modals#index'

  get 'rendering/exception'

  get 'sql' => 'sql#index'

  get 'urls' => 'urls#index'

  get 'versions' => 'versions#index'

  mount Plunketts::Engine, at: "/"

  root 'application#home'
end
