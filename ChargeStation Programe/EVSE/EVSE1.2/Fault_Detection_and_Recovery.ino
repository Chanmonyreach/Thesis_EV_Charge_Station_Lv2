void OV_UV_OC_condition() {
  analogWrite(CP_PWM, 255);
  digitalWrite(POWER_RELAY, LOW);
  digitalWrite(READY_Charge_LED, LOW);
  digitalWrite(Charge_LED, LOW);
  digitalWrite(Fault_LED, HIGH);
  digitalWrite(BUZZER, HIGH);
  delay(100);
  digitalWrite(Fault_LED, LOW);
  digitalWrite(BUZZER, LOW);
  delay(100);
  buzzerActivated = false;  // Reset buzzer flag
}
void Checking_Earth() {
  if (Oscilate > 100) {  // Earth pin oscillation detected
    delay(1000);
  } else {
    // No earth detected
    analogWrite(CP_PWM, 255);
    digitalWrite(Charge_LED, LOW);
    digitalWrite(READY_Charge_LED, LOW);
    digitalWrite(Fault_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(300);
    digitalWrite(Fault_LED, LOW);
    digitalWrite(BUZZER, LOW);
    delay(300);
    buzzerActivated = false;  // Reset buzzer flag
  }
}