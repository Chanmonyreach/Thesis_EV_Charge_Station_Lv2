
// WiFi connection task
void WifiConnectTask(void *pvParameters) {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  vTaskDelete(NULL);  // Task will delete itself after WiFi is connected
}

// Control Pilot task
void controlPilotTask(void *pvParameters) {
  while (1) {
    findPeakVoltage();
    ledcWriteChannel(CP_PWM, currentToDutyCycle(limitCurrent));
    handleControlPilotState();
    Serial.printf("State: %s\tCP_PWM: %d\tPeak Voltage: %d\tCP_FB: %d\n", State.c_str(), CP_PWM, peakVoltage, CP_FB);
    vTaskDelay(1 / portTICK_PERIOD_MS);
  }
}

// Update task for charge process and station data
void UpdateTask(void *pvParameters) {
  while (1) {
    if (WiFi.status() == WL_CONNECTED) {
      // Check charge process status and update accordingly
      if (checkChargeProcess(StationID) == "waiting") {
        // Check station state and update charge process
        if (State == "A") {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "error");
        } else if (State == "B") {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "Charge");
        } else if (State == "C" && checkChargeProcess(StationID) == "Charge") {
          digitalWrite(POWER_RELAY, HIGH);
          updateStationData(StationID, targetPower, chargePower, cost, ChargeHours, ChargeMinutes, latitude, longitude);
        } else {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "error");
        }
      }
    }
    vTaskDelay(5000 / portTICK_PERIOD_MS);  // Delay for 5 seconds before the next update
  }
}