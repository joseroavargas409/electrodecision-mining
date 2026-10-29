import type {Metadata} from 'next';
import ReviewerDemo from '../reviewer-demo';
export const metadata:Metadata={title:'ElectroDecision | Mining Electrification Copilot',description:'An inspectable mining electrification simulator and NVIDIA Nemotron copilot served through Nebius Token Factory.'};
export default function DemoPage(){return <ReviewerDemo/>}
