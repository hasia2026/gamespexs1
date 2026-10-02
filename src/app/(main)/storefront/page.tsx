import PlannedPage from "@/components/PlannedPage";

export default function StorefrontPage() {
  return (
    <PlannedPage
      title="Storefront"
      phase="Phase 7"
      icon="🏠"
      description="The physical GAMESPEXS location: reservations, game rooms, theater, survey stations, gift shop."
      items={[
        "Reservations — participant bookings",
        "Game Rooms & Theater — scheduling",
        "Survey Stations — dedicated research terminals",
        "Gift Shop & Merchandise — point of sale",
        "Sponsor Displays — ad inventory in the space",
      ]}
    />
  );
}
