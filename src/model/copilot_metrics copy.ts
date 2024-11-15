export class Language {
  name: string;
  total_engaged_users: number;
  total_code_suggestions?: number;
  total_code_acceptances?: number;
  total_code_lines_suggested?: number;
  total_code_lines_accepted?: number;

  constructor(data: any) {
    this.name = data.name;
    this.total_engaged_users = data.total_engaged_users;
    this.total_code_suggestions = data.total_code_suggestions;
    this.total_code_acceptances = data.total_code_acceptances;
    this.total_code_lines_suggested = data.total_code_lines_suggested;
    this.total_code_lines_accepted = data.total_code_lines_accepted;
  }
}

export class copilot_ide_code_completions_model {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date?: string | null;
  total_engaged_users: number;
  languages: Language[];

  constructor(data: any) {
    this.name = data.name;
    this.is_custom_model = data.is_custom_model;
    this.custom_model_training_date = data.custom_model_training_date;
    this.total_engaged_users = data.total_engaged_users;
    this.languages = data.languages.map((item: any) => new Language(item));
  }
}

export class copilot_ide_chat_model {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date?: string | null;
  total_engaged_users: number;
  total_chats: number;
  total_chat_insertion_events: number;
  total_chat_copy_events: number;

  constructor(data: any) {
    this.name = data.name;
    this.is_custom_model = data.is_custom_model;
    this.custom_model_training_date = data.custom_model_training_date;
    this.total_engaged_users = data.total_engaged_users;
    this.total_chats = data.total_chats;
    this.total_chat_insertion_events = data.total_chat_insertion_events;
    this.total_chat_copy_events = data.total_chat_copy_events;
  }
}

export class copilot_dotcom_chat_model {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date?: string | null;
  total_engaged_users: number;
  total_chats: number;

  constructor(data: any) {
    this.name = data.name;
    this.is_custom_model = data.is_custom_model;
    this.custom_model_training_date = data.custom_model_training_date;
    this.total_engaged_users = data.total_engaged_users;
    this.total_chats = data.total_chats;
  }
}

export class copilot_dotcom_pull_requests_model {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date?: string | null;
  total_engaged_users: number;
  total_pr_summaries_created: number;

  constructor(data: any) {
    this.name = data.name;
    this.is_custom_model = data.is_custom_model;
    this.custom_model_training_date = data.custom_model_training_date;
    this.total_engaged_users = data.total_engaged_users;
    this.total_pr_summaries_created = data.total_pr_summaries_created;
  }
}

export class copilot_ide_code_completions_editor {
  name: string;
  total_engaged_users: number;
  models: copilot_ide_code_completions_model[];

  constructor(data: any) {
    this.name = data.name;
    this.total_engaged_users = data.total_engaged_users;
    this.models = data.models.map((item: any) => new copilot_ide_code_completions_model(item));
  }
}

export class copilot_ide_chat_editor {
  name: string;
  total_engaged_users: number;
  models: copilot_ide_chat_model[];

  constructor(data: any) {
    this.name = data.name;
    this.total_engaged_users = data.total_engaged_users;
    this.models = data.models.map((item: any) => new copilot_ide_chat_model(item));
  }
}

export class copilot_dotcom_pull_requests_repository {
  name: string;
  total_engaged_users: number;
  models: copilot_dotcom_pull_requests_model[];

  constructor(data: any) {
    this.name = data.name;
    this.total_engaged_users = data.total_engaged_users;
    this.models = data.models.map((item: any) => new copilot_dotcom_pull_requests_model(item));
  }
}

export class copilot_metrics {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions: {
    total_engaged_users: number;
    languages: Language[];
    editors: copilot_ide_code_completions_editor[];
  };
  copilot_ide_chat: {
    total_engaged_users: number;
    editors: copilot_ide_chat_editor[];
  };
  copilot_dotcom_chat: {
    total_engaged_users: number;
    models: copilot_dotcom_chat_model[];
  };
  copilot_dotcom_pull_requests: {
    total_engaged_users: number;
    repositories: copilot_dotcom_pull_requests_repository[];
  };

  constructor(data: any) {
    this.date = data.date;
    this.total_active_users = data.total_active_users;
    this.total_engaged_users = data.total_engaged_users;
    this.copilot_ide_code_completions = {
      total_engaged_users: data.copilot_ide_code_completions.total_engaged_users,
      languages: data.copilot_ide_code_completions.languages.map((item: any) => new Language(item)),
      editors: data.copilot_ide_code_completions.editors.map((item: any) => new copilot_ide_code_completions_editor(item)),
    };
    this.copilot_ide_chat = {
      total_engaged_users: data.copilot_ide_chat.total_engaged_users,
      editors: data.copilot_ide_chat.editors.map((item: any) => new copilot_ide_chat_editor(item)),
    };
    this.copilot_dotcom_chat = {
      total_engaged_users: data.copilot_dotcom_chat.total_engaged_users,
      models: data.copilot_dotcom_chat.models.map((item: any) => new copilot_dotcom_chat_model(item)),
    };
    this.copilot_dotcom_pull_requests = {
      total_engaged_users: data.copilot_dotcom_pull_requests.total_engaged_users,
      repositories: data.copilot_dotcom_pull_requests.repositories.map((repo: any) => new copilot_dotcom_pull_requests_repository(repo)),
    };
  }
}