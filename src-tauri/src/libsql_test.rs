use libsql::{Builder, params};

#[tokio::main]
async fn main() {
    let db = Builder::new_local("test.db").build().await.unwrap();
    let conn = db.connect().unwrap();
    conn.execute("CREATE TABLE test (id TEXT, vec F32_BLOB(3))", ()).await.unwrap();
    conn.execute("INSERT INTO test VALUES (?, ?)", params!["a", vec![1.0f32.to_le_bytes(), 2.0f32.to_le_bytes(), 3.0f32.to_le_bytes()].concat()]).await.unwrap();
    let mut rows = conn.query("SELECT id, vec, vector_distance_cos(vec, ?) as dist FROM test", params![vec![1.0f32.to_le_bytes(), 2.0f32.to_le_bytes(), 3.0f32.to_le_bytes()].concat()]).await.unwrap();
    let row = rows.next().await.unwrap().unwrap();
    let id: String = row.get(0).unwrap();
    let dist: f32 = row.get(2).unwrap();
    println!("id: {}, dist: {}", id, dist);
}
