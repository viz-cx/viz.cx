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
          return <li key={post.slug}>
            <h3><a href={`/posts/` + post.slug}>{post.d.t}</a></h3>
          </li>
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
  const host = process.env.HOST || "http://localhost:3000"
  const result = await axios.get(`${host}/api/posts?page=${page}`)
  return {
    totalCount: result.data.meta.totalCount,
    pageCount: result.data.meta.pageCount,
    currentPage: result.data.meta.currentPage,
    perPage: result.data.meta.perPage,
    posts: result.data.posts,
    isLoading: false,
  }
}

export default withRouter(Home)
