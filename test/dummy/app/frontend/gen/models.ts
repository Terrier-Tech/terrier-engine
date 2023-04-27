// This file was automatically generated, DO NOT EDIT IT MANUALLY!

  import {OptionalProps} from "tuff-core/types"


export type Location = {
  id: string
  created_at: string
  updated_at: string
  _state: number
  created_by_id?: string
  created_by_name: string
  extern_id?: string
  updated_by_id?: string
  updated_by_name?: string
  annual_value?: number
  city?: string
  state?: string
  display_name: string
  number: number
  tags?: string[]
  status: string
  data?: object
  
  
  
  created_by ? : User
  
  
  
  updated_by ? : User
}

export type UnpersistedLocation = {
  
  id?: string
  
  created_at?: string
  
  updated_at?: string
  
  _state?: number
  
  created_by_id?: string
  
  created_by_name?: string
  
  extern_id?: string
  
  updated_by_id?: string
  
  updated_by_name?: string
  
  annual_value?: number
  
  city?: string
  
  state?: string
  
  display_name: string
  
  number: number
  
  tags?: string[]
  
  status: string
  
  data?: object
  
  
    
    
    
    created_by?: User
  
    
    
    
    updated_by?: User
  
  
}



export type Script = {
  id: string
  created_at: string
  updated_at: string
  _state: number
  created_by_id?: string
  created_by_name: string
  extern_id?: string
  updated_by_id?: string
  updated_by_name?: string
  body?: string
  title: string
  description?: string
  email_recipients?: string[]
  script_fields?: object
  report_category?: 'admin' | 'locations' | 'miscellaneous' | 'none'
  schedule_rules?: object
  schedule_rule_summaries?: string[]
  schedule_time: 'none' | 'evening' | 'morning' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18'
  num_per_year: number
  schedule_type: string
  order_grouping: 'combine' | 'separate'
  visibility: 'public' | 'private'
  org_id?: string
  
  
  
  created_by ? : User
  
  
  
  updated_by ? : User
  
  
  
  script_runs ? : ScriptRun[]
}

export type UnpersistedScript = {
  
  id?: string
  
  created_at?: string
  
  updated_at?: string
  
  _state?: number
  
  created_by_id?: string
  
  created_by_name?: string
  
  extern_id?: string
  
  updated_by_id?: string
  
  updated_by_name?: string
  
  body?: string
  
  title: string
  
  description?: string
  
  email_recipients?: string[]
  
  script_fields?: object
  
  report_category?: 'admin' | 'locations' | 'miscellaneous' | 'none'
  
  schedule_rules?: object
  
  schedule_rule_summaries?: string[]
  
  schedule_time: 'none' | 'evening' | 'morning' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18'
  
  num_per_year: number
  
  schedule_type: string
  
  order_grouping: 'combine' | 'separate'
  
  visibility: 'public' | 'private'
  
  org_id?: string
  
  
    
    
    
    created_by?: User
  
    
    
    
    updated_by?: User
  
    
    
    
      
      
    
    script_runs?: OptionalProps<UnpersistedScriptRun,'script_id'>[]
  
  
}

export const ScriptEnumFields = {
  order_grouping: ['combine','separate'] as const,
  report_category: ['admin','locations','miscellaneous','none'] as const,
  schedule_time: ['none','evening','morning','7','8','9','10','11','12','13','14','15','16','17','18'] as const,
  visibility: ['public','private'] as const,
}


export type ScriptRun = {
  id: string
  created_at: string
  updated_at: string
  _state: number
  created_by_id?: string
  created_by_name: string
  extern_id?: string
  updated_by_id?: string
  updated_by_name?: string
  duration?: number
  exception?: string
  backtrace?: string[]
  fields?: object
  log_file_name?: string
  log_content_type?: string
  log_file_size?: number
  log_updated_at?: string
  status: 'running' | 'success' | 'error' | 'cancelled' | 'cleared'
  script_id: string
  org_id?: string
  script_body?: string
  
  
  
  created_by ? : User
  
  
  
  updated_by ? : User
  
  
  
  script ? : Script
}

export type UnpersistedScriptRun = {
  
  id?: string
  
  created_at?: string
  
  updated_at?: string
  
  _state?: number
  
  created_by_id?: string
  
  created_by_name?: string
  
  extern_id?: string
  
  updated_by_id?: string
  
  updated_by_name?: string
  
  duration?: number
  
  exception?: string
  
  backtrace?: string[]
  
  fields?: object
  
  log_file_name?: string
  
  log_content_type?: string
  
  log_file_size?: number
  
  log_updated_at?: string
  
  status: 'running' | 'success' | 'error' | 'cancelled' | 'cleared'
  
  script_id: string
  
  org_id?: string
  
  script_body?: string
  
  
    
    
    
    created_by?: User
  
    
    
    
    updated_by?: User
  
    
    
    
    script?: Script
  
  
}

export const ScriptRunEnumFields = {
  status: ['running','success','error','cancelled','cleared'] as const,
}


export type User = {
  id: string
  created_at: string
  updated_at: string
  _state: number
  created_by_id?: string
  created_by_name: string
  extern_id?: string
  updated_by_id?: string
  updated_by_name?: string
  address1?: string
  address2?: string
  city?: string
  county?: string
  email?: string
  first_name: string
  last_logged_in_at?: string
  last_name: string
  notes_html?: string
  notes_raw?: string
  password_digest: string
  password_reset_token?: string
  password_reset_token_expires_at?: string
  role: string
  state?: string
  tags: string[]
  zip?: string
  
  
  
  created_by ? : User
  
  
  
  updated_by ? : User
}

export type UnpersistedUser = {
  
  id?: string
  
  created_at?: string
  
  updated_at?: string
  
  _state?: number
  
  created_by_id?: string
  
  created_by_name?: string
  
  extern_id?: string
  
  updated_by_id?: string
  
  updated_by_name?: string
  
  address1?: string
  
  address2?: string
  
  city?: string
  
  county?: string
  
  email?: string
  
  first_name: string
  
  last_logged_in_at?: string
  
  last_name: string
  
  notes_html?: string
  
  notes_raw?: string
  
  password_digest: string
  
  password_reset_token?: string
  
  password_reset_token_expires_at?: string
  
  role: string
  
  state?: string
  
  tags: string[]
  
  zip?: string
  
  
    
    
    
    created_by?: User
  
    
    
    
    updated_by?: User
  
  
}



/**
 * Map model names to their types.
 */
export type ModelTypeMap = {
  
    location: Location
  
    script: Script
  
    script_run: ScriptRun
  
    user: User
  
}

/**
 * Map model names to their unpersisted types.
 */
export type UnpersistedModelTypeMap = {
  
    location: UnpersistedLocation
  
    script: UnpersistedScript
  
    script_run: UnpersistedScriptRun
  
    user: UnpersistedUser
  
}

/**
 * Map model names to their association names.
 */
export type ModelIncludesMap = {
  
    
    location: 'created_by' | 'updated_by'
  
    
    script: 'created_by' | 'script_runs' | 'updated_by'
  
    
    script_run: 'created_by' | 'script' | 'updated_by'
  
    
    user: 'created_by' | 'updated_by'
  
}

/**
 * Map "sluggable" model names to their types
 */
export type SluggableModelTypeMap = {
  
    
    
    
    
}

/**
 * A type consisting of all possible model names.
 */
export type ModelName = keyof ModelTypeMap