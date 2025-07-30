type ChallengeDescription = {
    problemStatement: string;
    inputFormat: string;
    constraints: string;
    outputFormat: string;
    examples: {
      input: string;
      output: string;
      explanation: string;
    }[];
  };
  