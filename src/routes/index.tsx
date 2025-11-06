import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center gap-6 mb-6">
						<Gift className="w-24 h-24 md:w-32 md:h-32 text-cyan-400" />
						<h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
							<span className="text-gray-300">GIFT</span>{" "}
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								PLANNER
							</span>
						</h1>
					</div>
					<p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
						Plan gifts together with your groups
					</p>
					<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
						Create groups, organize events, manage wishlists, and assign gifts
						to group members. Never forget a gift again!
					</p>
					<div className="flex flex-col items-center gap-4">
						<Link to="/groups">
							<Button size="lg" className="px-8 py-6 text-lg">
								Get Started
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
						<h3 className="text-xl font-semibold text-white mb-3">
							Create Groups
						</h3>
						<p className="text-gray-400 leading-relaxed">
							Organize your gift planning by creating groups with friends and
							family members.
						</p>
					</div>
					<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
						<h3 className="text-xl font-semibold text-white mb-3">
							Manage Events
						</h3>
						<p className="text-gray-400 leading-relaxed">
							Create events for birthdays, holidays, or any special occasion
							that needs gift planning.
						</p>
					</div>
					<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
						<h3 className="text-xl font-semibold text-white mb-3">
							Track Gifts
						</h3>
						<p className="text-gray-400 leading-relaxed">
							Assign gifts to group members and track purchase status to avoid
							duplicates.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
