import axios from "axios"

function Post({ post }: any) {
    switch (post.t) {
        case "p":
            return (<div>
                <h1>{post.d.t}</h1>
                <div>{post.d.m}</div>
            </div>)
        case "t":
            return (<div>
                <h1>Note {post._id}</h1>
                {post.d.t}
            </div>)
    }
}

// export async function getStaticPaths() {
//     let lastPage = await getLastPageNumber()
//     let paths = [Object]
//     while (lastPage > 0) {
//         lastPage -= 1
//         const response = await axios.get(`/posts?page=${lastPage}`)
//         const posts = response.data.posts
//         paths += posts.map((post: any) => ({
//             params: { id: post.id }
//         }))
//     }
//     return { paths, fallback: false }
// }

// export async function getStaticProps({ params }: any) {
//     const response = await axios.get(`/posts/${params.id}`)
//     const post = response.data.posts
//     // Pass post data to the page via props
//     return { props: { post } }
// }

Post.getInitialProps = async ({ query }: any) => {
    let id = query.id || ""
    const result = await axios.get(`http://localhost:3000/api/posts/${id}`)
    return {
      post: result.data.post,
      isLoading: false,
    }
  }

export default Post
