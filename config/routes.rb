Rails.application.routes.draw do

  Plunketts::Engine.routes.draw do
    get 'scripts/check'
    post 'scripts/compute_field_values'
    get 'scripts/constants'
    resources :scripts do

    end
    post 'scripts_streaming/exec'
  end

end
