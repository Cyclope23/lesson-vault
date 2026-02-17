export interface ParsedProgram {
  modules: ParsedModule[];
}

export interface ParsedModule {
  name: string;
  description?: string;
  topics: ParsedTopic[];
}

export interface ParsedTopic {
  title: string;
  description?: string;
}
