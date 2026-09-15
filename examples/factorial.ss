// Control flow
let n = 5;
let fact = 1;
while (n > 0) {
  fact = fact * n;
  n = n - 1;
}
print(fact);

if (fact == 120) {
  print("factorial ok");
} else {
  print("factorial failed");
}
