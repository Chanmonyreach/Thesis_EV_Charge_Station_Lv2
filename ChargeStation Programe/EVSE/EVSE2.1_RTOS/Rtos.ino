
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
    ledcWriteChannel(pwmChannel, currentToDutyCycle(limitCurrent));
    handleControlPilotState();
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
          if (RelayState == true) {
            updateStationData(StationID, targetPower, chargePower, cost, ChargeHours, ChargeMinutes, latitude, longitude);
          } else {
            updateChargeProcess(StationID, "error");
          }
        } else {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "error");
        }
      }
    }
    vTaskDelay(5000 / portTICK_PERIOD_MS);  // Delay for 5 seconds before the next update
  }
}

// Input Supply check base on current sensor
void currentDetectionTask(void *pvParameters) {
  while (1) {
    float voltagePeakToPeak = 0.0;
    float minVal = ADC_RES, maxVal = 0.0;

    // Sample ADC multiple times to capture peaks
    for (int i = 0; i < SAMPLES; i++) {
      int adcVal = analogRead(ADC_PIN);
      if (adcVal > maxVal) maxVal = adcVal;
      if (adcVal < minVal) minVal = adcVal;
      delayMicroseconds(100);  // Sampling delay
    }

    voltagePeakToPeak = (maxVal - minVal) * (ADC_REF_VOLT / ADC_RES);  // Convert ADC to voltage
    voltageRMS = voltagePeakToPeak / (2.0 * sqrt(2));                  // Convert peak-to-peak to RMS
    currentRMS = voltageRMS / BURDEN_RESISTOR * CT_TURNS;              // Convert voltage to current
    currentRMS = max(currentRMS, currentRMS);

    // Trigger detection if current exceeds threshold
    if (currentRMS > CURRENT_THRESHOLD) {
      SourceState = "High";
    } else {
      SourceState = "LOW";
    }

    vTaskDelay(pdMS_TO_TICKS(1));  // Wait 1 second before next detection
  }
}

// Pzem
void PzemTask(void *pvParameters) {
  while (1) {
    Pzem();
  }
  vTaskDelay(pdMS_TO_TICKS(100));
}

//Weld Detection
void WeldTask(void *pvParameters) {
  while (1) {
    Weld_detection();
    vTaskDelay(pdMS_TO_TICKS(1));  // Sample at 100Hz (every 10ms)
  }
}

// print result
void PrintTask(void *pvParameters) {
  while (1) {
    Serial.printf("State: %s\tweld: %.2f\tCP_PWM: %.2f\tPeak Voltage: %.2f\tCP_FB: %d\tSupply current: %.2f\tSupply's state: %s\n",
                  State.c_str(),  weld, currentToDutyCycle(limitCurrent), Pzem_voltage, CP_FB, Pzem_current, SourceState.c_str());

    vTaskDelay(100 / portTICK_PERIOD_MS);  // Delay to prevent flooding
  }
}
