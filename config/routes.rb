Rails.application.routes.draw do

  Plunketts::Engine.routes.draw do
    get 'scripts/check'
    get 'scripts/compute_field_values'
    get 'scripts/constants'
    resources :scripts do

    end
  end

end
