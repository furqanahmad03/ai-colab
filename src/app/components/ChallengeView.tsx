export function ChallengeView({
    title,
    description,
    input,
    output,
    submissionCount,
  }: {
    title: string;
    description: string;
    input?: string;
    output?: string;
    submissionCount?: number;
  }) {
    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{description}</p>
  
        {input && (
          <div className="mb-2">
            <strong>Sample Input:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm">{input}</pre>
          </div>
        )}
  
        {output && (
          <div className="mb-4">
            <strong>Expected Output:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm">{output}</pre>
          </div>
        )}
  
        {typeof submissionCount === "number" && (
          <p className="text-sm text-gray-500 mt-2">
            Submissions Today: <span className="font-medium">{submissionCount}</span>
          </p>
        )}
      </div>
    );
  }
  