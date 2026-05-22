#!/bin/bash
# Run 3 parallel region-focused blitz workers using Max plan (claude --print).
# Each worker handles a different region so they rarely compete for the same site.
#
# Usage:
#   nohup bash scripts/blitz-parallel.sh > logs/blitz-parallel.log 2>&1 &
#
# Monitor:
#   tail -f logs/worker-*.log
#   tail -f logs/blitz-progress.log

set -e
cd "$(dirname "$0")/.."
mkdir -p logs

TS=$(date +%Y%m%d-%H%M%S)

echo "=== Parallel blitz started at $(date) ==="

# Worker 1: Indo-Pacific (dominant share of world-class sites)
bash scripts/blitz-worker.sh indo-pacific \
  "Indonesia, Philippines, Malaysia, Thailand, Vietnam, Papua New Guinea, Solomon Islands, Fiji, Vanuatu, Micronesia (Palau/Yap/Chuuk/Pohnpei), French Polynesia, Cook Islands, Tonga, Samoa, Australia, New Zealand, Japan, South Korea, Taiwan, China, Hawaii" \
  > logs/worker-indo-pacific-$TS.log 2>&1 &
PID1=$!
echo "Started indo-pacific worker: PID=$PID1"

sleep 5  # stagger startup to reduce push races

# Worker 2: Americas + Atlantic
bash scripts/blitz-worker.sh americas-atlantic \
  "Caribbean (all islands), Mexico (Yucatán/Cozumel/Socorro), Belize, Honduras (Bay Islands), Cayman Islands, Costa Rica (Cocos), Panama, Colombia (Malpelo), Ecuador (Galápagos), Brazil, Argentina, USA (Florida/California/East Coast), Canada, Iceland, Azores, Canary Islands, Cape Verde, Madeira, Bermuda, Bahamas" \
  > logs/worker-americas-atlantic-$TS.log 2>&1 &
PID2=$!
echo "Started americas-atlantic worker: PID=$PID2"

sleep 5

# Worker 3: Indian Ocean + Middle East + Mediterranean + Africa
bash scripts/blitz-worker.sh indian-med-africa \
  "Maldives, Sri Lanka, Lakshadweep, Andaman Islands, India coastlines, Seychelles, Madagascar, Mauritius, Réunion, Comoros, Egypt Red Sea, Sudan Red Sea, Saudi Arabia Red Sea, Jordan, Israel, Oman, Yemen Socotra, South Africa (Aliwal/Sodwana/Cape), Mozambique, Tanzania (Zanzibar/Pemba/Mafia), Kenya, Mediterranean (Malta/Cyprus/Greece/Italy/Spain/France/Croatia/Turkey), West Africa (Sao Tome)" \
  > logs/worker-indian-med-africa-$TS.log 2>&1 &
PID3=$!
echo "Started indian-med-africa worker: PID=$PID3"

echo "All 3 workers running. PIDs: $PID1 $PID2 $PID3"
echo "Logs: logs/worker-{indo-pacific,americas-atlantic,indian-med-africa}-$TS.log"
echo "Progress: tail -f logs/blitz-progress.log"

# Wait for all workers to finish
wait $PID1 $PID2 $PID3

echo "=== All workers complete at $(date) ==="
TOTAL=$(node -e "console.log(require('./src/data/sites.json').length)")
echo "Total sites now: $TOTAL"
