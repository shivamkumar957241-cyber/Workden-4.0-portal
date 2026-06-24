async function test() {
  try {
    const formData = new FormData();
    formData.append("image", new Blob(["hello world"]), "test.png");
    
    console.log("Uploading to ImgBB...");
    const response = await fetch("https://api.imgbb.com/1/upload?key=f884150e62a96137e936d460c00297d1", {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}

test();
