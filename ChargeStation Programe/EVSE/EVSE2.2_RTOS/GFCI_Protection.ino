/*
All GFCI function are here.
*/

void GFCI_Protection() {
  for (int i = 0; i < 1000; i++) {
    GFCI = max(GFCI, (float)analogRead(GFCI_pin));
  }
  if (GFCI > 0) {
    GFCI_tate = true;
  } else {
    GFCI_State = false;
    digitalWrite(POWER_RELAY, LOW);  // Turn off power relay for safety
    updateChargeProcess(StationID, "error");  // Update process in database/server
    Serial.println("Shock hazard detected! Power relay turned off.");
  }
}