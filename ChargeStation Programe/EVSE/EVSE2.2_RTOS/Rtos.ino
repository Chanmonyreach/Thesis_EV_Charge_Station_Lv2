/***
All RTOS function are here.
***/

/** 
if the Earth wire isn't detected! or there is Shock hazard detected!
the system will shout down.
**/

// PE protection
void PETask(void *pvParameters) {
  while (1) {
    PEdetection();
    vTaskDelay(pdMS_TO_TICKS(1));  // Wait 1 second before next detection
  }
}

// GFCI protection
void GFCITask(void *pvParameters) {
  while (1) {
    GFCI_Protection();
    vTaskDelay(pdMS_TO_TICKS(1));  // Wait 1 second before next detection
  }
}

// Protection task
void ProtectionTask(void *pvParameters) {
  //set while(1) to while (PEState && !GFCI_State) if PE and GFCI is supply or add in
  while (1) {
    if (pzem.current() <= limitCurrent && pzem.current() >= 0) {
      if (pzem.voltage() >= MinVoltage && pzem.voltage() <= MaxVoltage) {
        ProtectionState = true;
      } else {
        ProtectionState = false;
        digitalWrite(POWER_RELAY, LOW);           // Turn off power relay for safety
        updateChargeProcess(StationID, "error");  // Update process in database/server
        Serial.println("Warning! Over/Under voltage detected. Checking again in 1 second...");
        vTaskDelay(1000 / portTICK_PERIOD_MS);  // Wait for 1 second before rechecking
        continue;                               // Restart loop without further execution
      }
    } else {
      ProtectionState = false;
      digitalWrite(POWER_RELAY, LOW);           // Turn off power relay for safety
      updateChargeProcess(StationID, "error");  // Update process in database/server
      Serial.println("Warning! Overcurrent detected. Stopping system.");
      vTaskDelete(NULL);  // Delete this task
    }

    vTaskDelay(1 / portTICK_PERIOD_MS);  // Yield to other tasks
  }
}

// WiFi connection task
void WifiConnectTask(void *pvParameters) {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED && ProtectionState) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  vTaskDelete(NULL);  // Task will delete itself after WiFi is connected
}

// Control Pilot task
void controlPilotTask(void *pvParameters) {
  while (ProtectionState) {
    findPeakVoltage();
    ledcWriteChannel(pwmChannel, currentToDutyCycle(limitCurrent));
    handleControlPilotState();
    vTaskDelay(1 / portTICK_PERIOD_MS);
  }
  Serial.println("Protection triggered. Deleting ControlPilotTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}

// Update task for charge process and station data
void UpdateTask(void *pvParameters) {
  while (ProtectionState) {
    if (WiFi.status() == WL_CONNECTED) {
      // Check charge process status and update accordingly
      if (checkChargeProcess(StationID) == "waiting") {
        // Check station state and update charge process
        if (Evss_State == "A") {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "error");
        } else if (Evss_State == "B") {
          digitalWrite(POWER_RELAY, LOW);
          updateChargeProcess(StationID, "Charge");
        } else if (Evss_State == "C" && checkChargeProcess(StationID) == "Charge") {
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
  Serial.println("Protection triggered. Deleting UpdateTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}

// Input Supply check base on current sensor
void currentDetectionTask(void *pvParameters) {
  while (ProtectionState) {
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
  Serial.println("Protection triggered. Deleting currentDetectionTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}

// Pzem
void PzemTask(void *pvParameters) {
  while (ProtectionState) {
    Pzem();
    vTaskDelay(pdMS_TO_TICKS(100));
  }

  Serial.println("Protection triggered. Deleting PzemTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}

//Weld Detection
void WeldTask(void *pvParameters) {
  while (ProtectionState) {
    Weld_detection();
    vTaskDelay(pdMS_TO_TICKS(1));  // Sample at 100Hz (every 10ms)
  }
  Serial.println("Protection triggered. Deleting WeldTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}

// print result
void PrintTask(void *pvParameters) {
  while (ProtectionState) {
    Serial.print("Supply's State: ");
    Serial.println(SourceState);

    Serial.print("EVSS State: ");
    Serial.println(Evss_State);

    Serial.print("Relay State: ");
    Serial.println(RelayState);

    Serial.print("Peak Voltage: ");
    Serial.println(Pzem_voltage, 2);  // Print with 2 decimal places

    Serial.print("Supply Current: ");
    Serial.println(Pzem_current, 2);  // Print with 2 decimal places

    Serial.print("Delivery Energy: ");
    Serial.println(chargePower);

    Serial.println("------------------------");  // Extra line for readability

    vTaskDelay(100 / portTICK_PERIOD_MS);  // Delay to prevent flooding
  }
  Serial.println("Protection triggered. Deleting PrintTask.");
  vTaskDelete(NULL);  // Task deletes itself instead of returning
}
