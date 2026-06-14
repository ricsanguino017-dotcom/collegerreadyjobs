export default function Callback() {
  return null
}

export async function getServerSideProps(context) {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  }
}
