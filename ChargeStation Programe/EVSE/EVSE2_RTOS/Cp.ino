void resetOutputs() {
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(Float_LED, LOW);
  digitalWrite(BUZZER, LOW);
}

void findPeakVoltage() {
  peakVoltage = 0;
  for (int i = 0; i < 1000; i++) {
    peakVoltage = max(peakVoltage, (int)analogRead(CP_FB));
  }
}

float currentToDutyCycle(float current) {
  if (current < 51) return ((current / 0.6) * 255 / 100);
  if (current < 80) return (((current / 2.5) + 64) * 255 / 100);
  return 255;  // Max duty cycle
}

void updateLEDs(int state) {
  resetOutputs();
  switch (state) {
    case 1: digitalWrite(Float_LED, HIGH); break;
    case 2: digitalWrite(READY_Charge_LED, HIGH); break;
    case 3: digitalWrite(Charge_LED, HIGH); break;
    case -1: digitalWrite(Fault_LED, HIGH); break;
  }
}

void handleControlPilotState() {
  if (peakVoltage >= stateThresholds[0][0] && peakVoltage <= stateThresholds[0][1]) {
    State = "A";
    buzzerActivated = false;
    updateLEDs(1);
  } else if (peakVoltage >= stateThresholds[1][0] && peakVoltage <= stateThresholds[1][1]) {
    State = "B";
    buzzerActivated = false;
    updateLEDs(2);
  } else if (peakVoltage >= stateThresholds[2][0] && peakVoltage <= stateThresholds[2][1]) {
    State = "C";
    if (!buzzerActivated) {
      Serial.println("Buzzer Triggered!");
      digitalWrite(BUZZER, HIGH);
      delay(500);
      digitalWrite(BUZZER, LOW);
      buzzerActivated = true;
    }
    updateLEDs(3);
  } else {
    State = "";
    updateLEDs(-1);
    ledcWriteChannel(CP_PWM, 255);
    if (!buzzerActivated) {
      Serial.println("Fault - Buzzer Triggered!");
      digitalWrite(BUZZER, HIGH);
      delay(500);
      digitalWrite(BUZZER, LOW);
      buzzerActivated = true;
    }
  }
}
