import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactPaginate from 'react-paginate'
import Router, { withRouter } from 'next/router'
import styles from '../styles/Home.module.css'

const Home = (props: any) => {
  const [isLoading, setLoading] = useState(false)
  const startLoading = () => setLoading(true)
  const stopLoading = () => setLoading(false)

  useEffect(() => {
    Router.events.on('routeChangeStart', startLoading)
    Router.events.on('routeChangeComplete', stopLoading)

    return () => {
      Router.events.off('routeChangeStart', startLoading)
      Router.events.off('routeChangeComplete', stopLoading)
    }
  }, [])

  const pagginationHandler = (page: { selected: number }) => {
    const currentPath = props.router.pathname
    const currentQuery = { ...props.router.query }
    currentQuery.page = page.selected + 1

    props.router.push({
      pathname: currentPath,
      query: currentQuery,
    })
  }

  let content = null
  if (isLoading)
    content = <div>Loading...</div>
  else {
    content = (
      <ul>
        {props.posts.map((post: any) => {
          return <li key={post._id}>{post.d.t}</li>
        })}
      </ul>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Posts</h1>
      <div className={styles.posts}>
        {content}
      </div>

      <ReactPaginate
        previousLabel={'previous'}
        nextLabel={'next'}
        breakLabel={'...'}
        // breakClassName={styles.breakMe}
        // activeClassName={styles.active}
        containerClassName={styles.pagination}
        initialPage={props.currentPage - 1}
        pageCount={props.pageCount}
        // marginPagesDisplayed={2}
        // pageRangeDisplayed={5}
        onPageChange={pagginationHandler}
      />
    </div>
  )
}

Home.getInitialProps = async ({ query }: any) => {
  let page = query.page || 0
  const posts = await axios.get(`http://localhost:3000/api/posts?page=${page}`)
  return {
    totalCount: posts.data.meta.totalCount,
    pageCount: posts.data.meta.pageCount,
    currentPage: posts.data.meta.currentPage,
    perPage: posts.data.meta.perPage,
    posts: posts.data.posts,
    isLoading: false,
  }
}

export default withRouter(Home)
