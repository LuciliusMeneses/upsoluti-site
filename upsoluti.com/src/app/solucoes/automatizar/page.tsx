import SolutionPage from '@/components/SolutionPage';
import { solutionData } from '@/lib/solutions';
import { pageMetadata } from '@/lib/site';

const solution = solutionData['automatizar'];
export const metadata = pageMetadata(solution.name, solution.description, '/solucoes/automatizar');
export default function Page() { return <SolutionPage slug="automatizar" />; }
