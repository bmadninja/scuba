import Foundation

struct DiveDestination: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let region: String
    let bestSeason: String
    let encounter: String
    let summary: String
}

extension DiveDestination {
    static let sample: [DiveDestination] = [
        DiveDestination(
            name: "Raja Ampat",
            region: "Indonesia",
            bestSeason: "October to April",
            encounter: "Manta rays and reef biodiversity",
            summary: "A starter view for comparing destination timing, signature wildlife, and trip planning context."
        ),
        DiveDestination(
            name: "Socorro",
            region: "Mexico",
            bestSeason: "November to May",
            encounter: "Giant Pacific manta rays",
            summary: "A liveaboard-focused route where seasonality and conditions matter more than shore logistics."
        ),
        DiveDestination(
            name: "Great Barrier Reef",
            region: "Australia",
            bestSeason: "June to November",
            encounter: "Coral gardens, turtles, and reef fish",
            summary: "A broad region suited to iPad browsing, future filtering, and deeper site-level drilldowns."
        )
    ]
}
