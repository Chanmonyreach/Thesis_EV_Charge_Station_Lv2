/*
All Weld-Detection function are here.
*/

void Weld_detection() {
  // weld = digitalRead(Weld_pin);  // Read signal

  for (int i = 0; i < 1000; i++) {
    weld = max(weld, (float)analogRead(Weld_pin));
  }

  if (weld > 0) {
    RelayState = true;
  } else {
    RelayState = false;
  }
}