
// Function to find peak voltage
void findPeakVoltage() {
  peak_voltage = 0;  // Reset the peak voltage
  for (int i = 0; i < 1000; i++) {
    int current_voltage = analogRead(CP_FB);  // Read the current voltage
    if (current_voltage > peak_voltage) {
      peak_voltage = current_voltage;  // Update the peak voltage if current reading is higher
    }
  }
}

// State Handlers
void handleStateA() {
  if (digitalRead(Fault_PIN) == 1) {
    GFCI_selftest();
  } else {
    pzem.resetEnergy();
    amp = EEPROM.read(0);

    if (digitalRead(set_Current_PIN) == 0) {
      digitalWrite(BUZZER, 1);
      delay(50);
      buzzerActivated = false;
      if (amp < 15) {
        amp += 3;  // Increase by 3
      } else if (amp < 16) {
        amp += 1;  // Increase by 1 when amp reaches 15
      } else {
        amp = 6;  // Reset to 6 when it goes beyond 16
      }
      EEPROM.write(0, amp);  // Store updated amp value in EEPROM
    }

    analogWrite(CP_PWM, 255);
    digitalWrite(Charge_LED, HIGH);
    digitalWrite(Fault_LED, LOW);
    digitalWrite(READY_Charge_LED, HIGH);
    digitalWrite(BUZZER, LOW);
    digitalWrite(POWER_RELAY, LOW);
    buzzerActivated = false;
  }
}

void handleStateB() {
  digitalWrite(POWER_RELAY, LOW);
  analogWrite(CP_PWM, 22 + ((255 * (amp / 0.6)) / 100));
  digitalWrite(Charge_LED, HIGH);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(READY_Charge_LED, HIGH);
  digitalWrite(BUZZER, LOW);
  buzzerActivated = false;
}

void handleStateC() {
  digitalWrite(POWER_RELAY, HIGH);
  analogWrite(CP_PWM, 22 + ((255 * (amp / 0.6)) / 100));
  digitalWrite(Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(READY_Charge_LED, HIGH);
  if (!buzzerActivated) {
    digitalWrite(BUZZER, HIGH);
    delay(500);  // Short delay for buzzer
    digitalWrite(BUZZER, LOW);
    buzzerActivated = true;  // Set buzzer flag to prevent reactivation
  }
  while (peak_voltage >= stateC_Thres_min && peak_voltage < stateC_Thres_max) {
    findPeakVoltage();  // Update the peak voltage

    if (!timerRunning) {
      startTime = millis() - elapsedTime;
      timerRunning = true;
    }

    if (millis() - startTime >= 60000) {
      elapsedTime = millis() - startTime;
    }
  }
}
