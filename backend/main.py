from fastapi import FastAPI

app = FastAPI(title="Aion-gil API")


@app.get("/")
def root():
    return {"message": "Aion-gil API is running"}
    

@app.get("/health")
def health():
    return {"status": "ok"}
