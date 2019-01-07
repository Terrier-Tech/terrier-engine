Rails.application.routes.draw do

  Plunketts::Engine.routes.draw do
    get 'scripts/check'
    post 'scripts/compute_field_values'
    get 'scripts/constants'
    get 'scripts/search_results'
    resources :scripts do
      get 'runs'
    end
    post 'scripts_streaming/exec'
  end

end
