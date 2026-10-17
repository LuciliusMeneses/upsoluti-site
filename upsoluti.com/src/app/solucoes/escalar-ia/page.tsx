import SolutionPage from '@/components/SolutionPage';
import { solutionData } from '@/lib/solutions';
import { pageMetadata } from '@/lib/site';

const solution = solutionData['escalar-ia'];
export const metadata = pageMetadata(solution.name, solution.description, '/solucoes/escalar-ia');
export default function Page() { return <SolutionPage slug="escalar-ia" />; }
