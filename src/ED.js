function E(text, key) {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const keyBytes = encoder.encode(key);
  const eb = textBytes.map((byte, index) => {
    const keyByte = keyBytes[index % keyBytes.length];
    return byte ^ keyByte;
  });
  return btoa(String.fromCharCode(...eb));
}

function D(eb64, key) {
  const eb = new Uint8Array(
    atob(eb64).split("").map(char => char.charCodeAt(0))
  );
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const db = eb.map((byte, index) => {
    const keyByte = keyBytes[index % keyBytes.length];
    return byte ^ keyByte;
  });
  const decoder = new TextDecoder();
  return decoder.decode(db);
}

export { E, D }
