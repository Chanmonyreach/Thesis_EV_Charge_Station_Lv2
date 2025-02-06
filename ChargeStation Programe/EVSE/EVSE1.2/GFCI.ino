
void Checking_GFCI() {
  if (digitalRead(Fault_PIN) == 1) {
    digitalWrite(Charge_LED, LOW);
    analogWrite(CP_PWM, 255);
    digitalWrite(READY_Charge_LED, LOW);
    digitalWrite(POWER_RELAY, LOW);
    digitalWrite(Fault_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(50);
    digitalWrite(BUZZER, LOW);
    digitalWrite(Fault_LED, LOW);
    delay(50);
    buzzerActivated = false;
  }
}

void GFCI_selftest() {
  analogWrite(CP_PWM, 255);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(Fault_LED, HIGH);
  digitalWrite(BUZZER, HIGH);
  delay(100);
  digitalWrite(BUZZER, LOW);
  digitalWrite(Fault_LED, LOW);
  delay(100);
  buzzerActivated = false;
}
