import InputForm from '../InputForm';

export default function InputFormExample() {
  const handleAnalyze = (url: string) => {
    console.log('Analyzing URL:', url);
    // Mock analysis - in real app this would call the backend
  };

  return (
    <div className="p-8 bg-background">
      <InputForm onAnalyze={handleAnalyze} />
    </div>
  );
}