import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
)

/**
 * Recursive list for all files in buckets
 * @param {*} bucket 
 * @param {*} path 
 * @returns list of the full path of all files in a bucket
 */
async function listAllFiles(bucket, path = '') {
  const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 })
  if (error) throw error

  let files = []
  for (const item of data) {
    const fullPath = path ? `${path}/${item.name}` : item.name
    // folder case -> recursion
    if (item.id === null) {
      files = files.concat(await listAllFiles(bucket, fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Delete files in a bucket
 * @param {*} bucket 
 * @returns 
 */
async function emptyBucket(bucket, bucketFiles) {
  if (bucketFiles.length === 0) return
  // delete by chunk
  for (let i = 0; i < bucketFiles.length; i += 1000) {
    const chunk = bucketFiles.slice(i, i + 1000)
    const { error } = await supabase.storage.from(bucket).remove(chunk)
    if (error) throw error
  }
}


/**
 * Empty all the buckets
 */
async function resetAllBuckets() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error

  for (const bucket of buckets) {
    const files = await listAllFiles(bucket.name);
    console.log(`→ Emptying "${bucket.name}" (${files.length} files)`);
    await emptyBucket(bucket, files);

    // Odelet the bucket
    const { error: delErr } = await supabase.storage.deleteBucket(bucket.name)
    if (delErr) throw delErr
    console.log(`  ✓ Bucket "${bucket.name}" deleted`)
  }
}

resetAllBuckets()
  .then(() => console.log('All bucket has been deleted.'))
  .catch(err => { console.error(err); process.exit(1) })