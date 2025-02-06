
void Disp_Power() {
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();

  if (voltage <= 200) {  // Undervoltage
    OV_UV_OC_condition();
    undervoltageCondition = true;
    delay(wait);
  } else if (undervoltageCondition && voltage > 200) {
    undervoltageCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }

  if (voltage > 240) {  // Overvoltage
    OV_UV_OC_condition();
    overvoltageCondition = true;
    delay(wait);
  } else if (overvoltageCondition && voltage < 240) {
    overvoltageCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }

  if (current > 20) {  // Overcurrent
    OV_UV_OC_condition();
    overCurrentCondition = true;
    delay(wait);
  } else if (overCurrentCondition && current < 20) {
    overCurrentCondition = false;
    handleStateA();
    handleStateB();
    handleStateC();
  }
}
