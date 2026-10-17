import SolutionPage from '@/components/SolutionPage';
import { solutionData } from '@/lib/solutions';
import { pageMetadata } from '@/lib/site';

const solution = solutionData['vender-mais'];
export const metadata = pageMetadata(solution.name, solution.description, '/solucoes/vender-mais');
export default function Page() { return <SolutionPage slug="vender-mais" />; }
