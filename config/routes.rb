Rails.application.routes.draw do

  Terrier::Engine.routes.draw do
    get 'scripts/check'
    post 'scripts/compute_field_values'
    get 'scripts/constants'
    get 'scripts/search_results'
    resources :scripts do
      get 'runs'
    end
    post 'scripts_streaming/exec'
    post 'sql/exec'
  end

end
