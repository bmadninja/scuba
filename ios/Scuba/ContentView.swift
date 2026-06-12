import SwiftUI

struct ContentView: View {
    private let destinations = DiveDestination.sample

    var body: some View {
        NavigationStack {
            List(destinations) { destination in
                NavigationLink(value: destination) {
                    DestinationRow(destination: destination)
                }
            }
            .navigationTitle("Scuba Season")
            .navigationDestination(for: DiveDestination.self) { destination in
                DestinationDetailView(destination: destination)
            }
        }
    }
}

private struct DestinationRow: View {
    let destination: DiveDestination

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(destination.name)
                .font(.headline)

            Text(destination.region)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Label(destination.bestSeason, systemImage: "calendar")
                .font(.caption)
                .foregroundStyle(.teal)
        }
        .padding(.vertical, 6)
    }
}

private struct DestinationDetailView: View {
    let destination: DiveDestination

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(destination.region)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Text(destination.name)
                        .font(.largeTitle.bold())
                }

                GroupBox("Best Season") {
                    Label(destination.bestSeason, systemImage: "calendar.badge.clock")
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                GroupBox("Signature Encounter") {
                    Label(destination.encounter, systemImage: "sparkles")
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                GroupBox("Dive Brief") {
                    Text(destination.summary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding()
        }
        .navigationTitle(destination.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    ContentView()
}
