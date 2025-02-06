/*
All PE function are here.
*/

void PEdetection() {
  for (int i = 0; i < 1000; i++) {
    PE = max(PE, (float)analogRead(PE_pin));
  }
  if (PE > 0) {
    PEState = true;
  } else {
    PEState = false;
    digitalWrite(POWER_RELAY, LOW);  // Turn off power relay for safety
    updateChargeProcess(StationID, "error");  // Update process in database/server
    Serial.println("Earth Wire fault detected!");
  }
}