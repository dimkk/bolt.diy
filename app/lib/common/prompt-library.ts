import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';
import { getSystemPromptGiga } from './prompts/sberGigaChat_full';
import optimizedGiga from './prompts/sberGigaChat_optimised';
import sberGigaChat_short from './prompts/sberGigaChat_short';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default: {
      label: 'Default Prompt',
      description: 'This is the battle tested default system Prompt',
      get: (options) => getSystemPrompt(options.cwd),
    },
    optimized: {
      label: 'Optimized Prompt (experimental)',
      description: 'an Experimental version of the prompt for lower token usage',
      get: (options) => optimized(options),
    },
    sberGigaChat_full: {
      label: 'SberGigaChat Full',
      description: 'Full version of the prompt for SberGigaChat',
      get: (options) => getSystemPromptGiga(options.cwd),
    },
    sberGigaChat_optimised: {
      label: 'SberGigaChat Optimized',
      description: 'Optimized version of the prompt for SberGigaChat',
      get: (options) => optimizedGiga(options),
    },
    sberGigaChat_short: {
      label: 'SberGigaChat Short',
      description: 'Short version of the prompt for SberGigaChat',
      get: () => sberGigaChat_short(),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Prompt Now Found';
    }

    return this.library[promptId]?.get(options);
  }
}
