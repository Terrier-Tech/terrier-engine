Rails.application.routes.draw do

  Terrier::Engine.routes.draw do
    get 'scripts/check'
    post 'scripts/compute_field_values'
    get 'scripts/constants'
    get 'scripts/search_results'
    resources :scripts do
      get 'runs'
      get 'action_log'
      post 'clear_run/:run_id' => 'scripts#clear_run'
    end
    post 'scripts_streaming/exec'

    post 'sql/exec'

    get 'top' => 'top#index' # TODO: remove once everyone is using /system/top
    get 'system/top'
    get 'system/public_key'

    get 'db/schema'
    post 'db/model/:model' => 'db#get_model'
    post 'db/model/:model/count' => 'db#count_model'
    post 'db/model/:model/upsert' => 'db#upsert_model'

    get 'data_dive/list'
    get 'data_dive/user_session'
    get 'data_dive/test_dive'
    post 'data_dive/validate_query'
    post 'data_dive/preview_query'
    get 'data_dive/download_run/:id/:filename' => 'data_dive#download_run'
    get 'data_dive/stream_run/:run_id' => 'data_dive#stream_run'
    get 'data_dive' => 'data_dive#entrypoint'
    get 'data_dive/*rel' => 'data_dive#entrypoint'
  end

end
